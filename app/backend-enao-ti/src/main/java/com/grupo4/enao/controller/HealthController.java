package com.grupo4.enao.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Endpoint de salud del servicio.
 *
 * Se usa como HEALTHCHECK del contenedor backend y como comprobacion de
 * disponibilidad en los despliegues. Es publico a proposito: un monitor
 * externo no debe necesitar credenciales para consultar el estado.
 * No expone datos del negocio, solo metadatos tecnicos.
 */
@RestController
@RequiredArgsConstructor
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "UP");
        body.put("service", "backend-enao");
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("database", databaseState());
        return ResponseEntity.ok(body);
    }

    /**
     * Comprueba la conexion con la base de datos. Si la base no responde,
     * el servicio se declara DOWN porque no puede operar.
     */
    private String databaseState() {
        try {
            Integer one = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return (one != null && one == 1) ? "UP" : "DOWN";
        } catch (Exception ex) {
            return "DOWN";
        }
    }
}
