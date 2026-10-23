package com.grupo4.enao.config;

import org.springframework.context.annotation.Configuration;

/**
 * Configuracion del almacenamiento de objetos. La implementacion concreta se
 * elige automaticamente segun files.storage.provider (filesystem en el
 * laboratorio, s3 con Amazon S3 o con MinIO).
 */
@Configuration
public class ObjectStorageConfiguration {
}