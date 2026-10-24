package com.grupo4.enao.exception;

/** El cuerpo o el archivo supera el limite configurado (HTTP 413). */
public class PayloadTooLargeException extends RuntimeException {
    public PayloadTooLargeException(String message) { super(message); }
}