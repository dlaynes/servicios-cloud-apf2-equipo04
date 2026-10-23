package com.grupo4.enao.storage;

import com.grupo4.enao.config.FilesProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.net.URI;
import java.time.Duration;

/**
 * Almacenamiento sobre la API de S3. Sirve tanto para Amazon S3 real como
 * para un bucket compatible (MinIO o LocalStack) usado como equivalente del
 * recurso S-02 mientras no llegue el despliegue en la nube.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "files.storage.provider", havingValue = "s3")
public class S3ObjectStorage implements ObjectStorageAdapter {

    private final FilesProperties properties;

    private FilesProperties.Storage config() {
        return properties.getStorage();
    }

    private S3Client client() {
        S3ClientBuilder builder = S3Client.builder()
                .region(Region.of(config().getRegion()))
                .forcePathStyle(true);
        applyEndpoint(builder::endpointOverride);
        return builder.build();
    }

    private S3Presigner presigner() {
        S3Presigner.Builder builder = S3Presigner.builder()
                .region(Region.of(config().getRegion()))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build());
        if (config().getEndpoint() != null && !config().getEndpoint().isBlank()) {
            builder.endpointOverride(URI.create(config().getEndpoint()));
        }
        return builder.build();
    }

    private void applyEndpoint(java.util.function.Consumer<URI> setter) {
        if (config().getEndpoint() != null && !config().getEndpoint().isBlank()) {
            setter.accept(URI.create(config().getEndpoint()));
        }
    }

    @Override
    public void store(String key, byte[] data, String contentType) throws IOException {
        try (S3Client client = client()) {
            client.putObject(PutObjectRequest.builder()
                            .bucket(config().getBucket())
                            .key(key)
                            .contentType(contentType)
                            .build(),
                    RequestBody.fromBytes(data));
        }
        log.debug("objeto {} almacenado en {}", key, config().getBucket());
    }

    @Override
    public byte[] read(String key) throws IOException {
        try (S3Client client = client()) {
            return client.getObjectAsBytes(GetObjectRequest.builder()
                    .bucket(config().getBucket())
                    .key(key)
                    .build()).asByteArray();
        }
    }

    @Override
    public void delete(String key) throws IOException {
        try (S3Client client = client()) {
            client.deleteObject(DeleteObjectRequest.builder().bucket(config().getBucket()).key(key).build());
        }
    }

    @Override
    public String presignedGetUrl(String key, Duration ttl) {
        try (S3Presigner presigner = presigner()) {
            return presigner.presignGetObject(GetObjectPresignRequest.builder()
                    .signatureDuration(ttl)
                    .getObjectRequest(GetObjectRequest.builder().bucket(config().getBucket()).key(key).build())
                    .build()).toString();
        }
    }

    @Override
    public String name() {
        return "s3";
    }
}