package com.grupo4.enao.dto;

import lombok.Builder;
import lombok.Value;

/** Contenido de un archivo entregado por el backend con sus cabeceras. */
@Value
@Builder
public class FileDownload {
    byte[] content;
    String contentType;
    String fileName;
}