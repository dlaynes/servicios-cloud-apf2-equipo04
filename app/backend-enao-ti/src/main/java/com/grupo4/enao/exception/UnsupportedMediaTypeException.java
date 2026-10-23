package com.grupo4.enao.exception;

/** Se usa cuando el tipo real del archivo no esta dentro de la lista blanca. */
public class UnsupportedMediaTypeException extends RuntimeException {
    public UnsupportedMediaTypeException(String message) { super(message); }
}