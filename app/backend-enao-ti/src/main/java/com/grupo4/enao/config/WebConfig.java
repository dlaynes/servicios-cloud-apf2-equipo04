package com.grupo4.enao.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

/**
 * Configuracion CORS.
 *
 * Los origenes permitidos se leen de la propiedad 'enao.cors.allowed-origins'
 * para poder ajustarlos por entorno (variable de entorno en el despliegue)
 * sin recompilar. En el despliegue con contenedores el navegador llama a un
 * unico origen (el proxy inverso de Nginx), por lo que CORS no se activa en
 * el flujo normal y esta configuracion queda como red de seguridad.
 */
@Configuration
public class WebConfig {

    @Value("${enao.cors.allowed-origins:}")
    private String allowedOrigins;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                List<String> origins = parseOrigins(allowedOrigins);

                if (origins.isEmpty()) {
                    // Sin origenes configurados no se registra ninguna regla CORS.
                    return;
                }

                registry.addMapping("/api/**")
                        .allowedOrigins(origins.toArray(String[]::new))
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600);
            }
        };
    }

    private List<String> parseOrigins(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
    }
}
