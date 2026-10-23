package com.grupo4.enao.exception;

/** Violacion de una regla de negocio: no es un error de servidor. */
public class BusinessRuleViolationException extends RuntimeException {
    public BusinessRuleViolationException(String message) { super(message); }
}