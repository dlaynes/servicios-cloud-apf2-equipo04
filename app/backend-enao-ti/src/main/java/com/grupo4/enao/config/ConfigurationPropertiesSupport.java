package com.grupo4.enao.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuracion de soporte del backend: habilita las propiedades tipadas.
 * Los adapters de almacenamiento se eligen con @ConditionalOnProperty
 * (ver FilesystemObjectStorage y S3ObjectStorage).
 */
@Component
@EnableConfigurationProperties({FilesProperties.class, ReportsProperties.class})
@RequiredArgsConstructor
public class ConfigurationPropertiesSupport {
}