package com.grupo4.enao.exception;

/** El usuario autenticado no tiene derecho sobre el recurso. */
public class ForbiddenOperationException extends RuntimeException {
    public ForbiddenOperationException(String message) { super(message); }
}