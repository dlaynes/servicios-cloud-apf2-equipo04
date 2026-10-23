package com.grupo4.enao.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Parametros de RF-03 (documentos adjuntos) y del almacenamiento de objetos.
 * Los limites y la lista blanca se leen de variables de entorno, no se
 * escriben en el codigo, para que el mismo artefacto sirva en dev y prod.
 */
@Data
@ConfigurationProperties(prefix = "files")
public class FilesProperties {

    /** Tamano maximo por archivo, en megabytes. */
    private long maxFileSizeMb = 10;

    /** Suma maxima por postulante, en megabytes. */
    private long maxTotalMbPerApplicant = 30;

    /** Numero maximo de documentos por postulante. */
    private int maxFilesPerApplicant = 5;

    /** Extensiones permitidas, en minusculas y sin punto. */
    private List<String> allowedExtensions = List.of("pdf", "png", "jpg", "jpeg");

    /** Tipos de documento aceptados, por ejemplo DNI o CERTIFICADO. */
    private List<String> allowedTypes = List.of("DNI", "CERTIFICADO", "RECEIPT", "OTRO");

    private Storage storage = new Storage();

    @Data
    public static class Storage {
        /** filesystem (laboratorio) o s3 (MinIO o Amazon S3). */
        private String provider = "filesystem";
        /** Directorio base del almacenamiento local. */
        private String path = "./data/documents";
        /** Nombre del bucket en S3 o en su equivalente compatible. */
        private String bucket = "enao-documents";
        /** Endpoint alternativo para MinIO o LocalStack; vacio usa AWS real. */
        private String endpoint = "";
        /** Region de S3. */
        private String region = "us-east-1";
        /** Minutos de vida de la URL prefirmada de descarga. */
        private int presignTtlMinutes = 15;
    }
}