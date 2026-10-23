package com.grupo4.enao.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Parametros de RF-08 (reportes agregados). Limita el tamano de pagina y el
 * numero de filas exportadas en linea, para que una peticion malformada no
 * produzca una consulta sin limites.
 */
@Data
@ConfigurationProperties(prefix = "reports")
public class ReportsProperties {

    /** Tamano maximo de pagina aceptado en un reporte. */
    private int maxPageSize = 500;

    /** Filas maximo exportadas en linea antes de exigir exportacion asincrona. */
    private long maxRowsInline = 20000;
}