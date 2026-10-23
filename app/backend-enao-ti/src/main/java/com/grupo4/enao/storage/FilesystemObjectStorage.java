package com.grupo4.enao.storage;

import com.grupo4.enao.config.FilesProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Duration;

/**
 * Almacenamiento local sobre el disco. Se usa en el laboratorio con Docker y
 * en pruebas, cuando el bucket de objetos no esta disponible.
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "files.storage.provider", havingValue = "filesystem", matchIfMissing = true)
public class FilesystemObjectStorage implements ObjectStorageAdapter {

    private final FilesProperties properties;

    private Path resolve(String key) throws IOException {
        String normalized = key.replace("\\", "/");
        Path base = Path.of(properties.getStorage().getPath()).toAbsolutePath().normalize();
        Path target = base.resolve(normalized).normalize();
        if (!target.startsWith(base)) {
            throw new IOException("clave de objeto fuera del directorio base: " + key);
        }
        Files.createDirectories(target.getParent());
        return target;
    }

    @Override
    public void store(String key, byte[] data, String contentType) throws IOException {
        Files.write(resolve(key), data,
                StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
    }

    @Override
    public byte[] read(String key) throws IOException {
        return Files.readAllBytes(resolve(key));
    }

    @Override
    public void delete(String key) throws IOException {
        Files.deleteIfExists(resolve(key));
    }

    @Override
    public String presignedGetUrl(String key, Duration ttl) {
        return null;
    }

    @Override
    public String name() {
        return "filesystem";
    }
}