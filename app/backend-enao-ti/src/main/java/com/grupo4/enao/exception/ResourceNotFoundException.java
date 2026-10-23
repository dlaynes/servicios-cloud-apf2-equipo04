package com.grupo4.enao.exception;

/** El recurso pedido no existe. */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) { super(message); }
}