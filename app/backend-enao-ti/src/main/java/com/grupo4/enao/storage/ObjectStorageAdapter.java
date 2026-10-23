package com.grupo4.enao.storage;

import java.io.IOException;
import java.time.Duration;

/**
 * Adapter sobre un almacenamiento de objetos. La implementacion local usa el
 * disco (volumen de Docker) y la alternativa usa la API de S3, de modo que
 * el resto del codigo no cambia cuando se migra del laboratorio a la nube.
 */
public interface ObjectStorageAdapter {

    /** guarda el objeto con la clave indicada. */
    void store(String key, byte[] data, String contentType) throws IOException;

    /** lee el objeto completo. */
    byte[] read(String key) throws IOException;

    /** elimina el objeto; los proveedores suelen ser idempotentes en este paso. */
    void delete(String key) throws IOException;

    /** URL firmada de descarga, o null si el proveedor no soporta la firma. */
    String presignedGetUrl(String key, Duration ttl);

    /** nombre corto del proveedor, util para logs y evidencias. */
    String name();
}