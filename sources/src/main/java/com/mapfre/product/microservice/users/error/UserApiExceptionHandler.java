package com.mapfre.product.microservice.users.error;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * Traduce los errores del API de usuarios a {@link ErrorResponse}.
 */
@RestControllerAdvice
public class UserApiExceptionHandler {

    static final String VALIDATION_CODE = "USR-400-VALIDATION";
    static final String VALIDATION_MESSAGE = "La petición contiene datos no válidos.";

    @ExceptionHandler(EmailDuplicadoError.class)
    public ResponseEntity<ErrorResponse> handleEmailDuplicado(EmailDuplicadoError ex) {
        return build(HttpStatus.CONFLICT, "USR-409", ex.getMessage(), List.of());
    }

    @ExceptionHandler(RolInvalidoError.class)
    public ResponseEntity<ErrorResponse> handleRolInvalido(RolInvalidoError ex) {
        return build(HttpStatus.BAD_REQUEST, "USR-400", ex.getMessage(), List.of());
    }

    @ExceptionHandler(UsuarioNoEncontradoError.class)
    public ResponseEntity<ErrorResponse> handleNoEncontrado(UsuarioNoEncontradoError ex) {
        return build(HttpStatus.NOT_FOUND, "USR-404", ex.getMessage(), List.of());
    }

    @ExceptionHandler(AutoDesactivacionError.class)
    public ResponseEntity<ErrorResponse> handleAutoDesactivacion(AutoDesactivacionError ex) {
        return build(HttpStatus.FORBIDDEN, "USR-403", ex.getMessage(), List.of());
    }

    @ExceptionHandler(EstadoCuentaError.class)
    public ResponseEntity<ErrorResponse> handleEstadoCuenta(EstadoCuentaError ex) {
        return build(HttpStatus.CONFLICT, "USR-409-STATUS", ex.getMessage(), List.of());
    }

    @ExceptionHandler(AutoAsignacionError.class)
    public ResponseEntity<ErrorResponse> handleAutoAsignacion(AutoAsignacionError ex) {
        return build(HttpStatus.BAD_REQUEST, "USR-400-SELF-MANAGER", ex.getMessage(), List.of());
    }

    @ExceptionHandler(MismoManagerError.class)
    public ResponseEntity<ErrorResponse> handleMismoManager(MismoManagerError ex) {
        return build(HttpStatus.BAD_REQUEST, "USR-400-SAME-MANAGER", ex.getMessage(), List.of());
    }

    @ExceptionHandler(ConflictoAsignacionError.class)
    public ResponseEntity<ErrorResponse> handleConflictoAsignacion(ConflictoAsignacionError ex) {
        return build(HttpStatus.CONFLICT, "USR-409-MANAGER", ex.getMessage(), List.of());
    }

    @ExceptionHandler(ManagerNoAsignadoError.class)
    public ResponseEntity<ErrorResponse> handleManagerNoAsignado(ManagerNoAsignadoError ex) {
        return build(HttpStatus.CONFLICT, "USR-409-NO-MANAGER", ex.getMessage(), List.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleBodyValidation(MethodArgumentNotValidException ex) {
        List<String> details = ex.getBindingResult().getAllErrors().stream()
                .map(error -> error instanceof FieldError fe
                        ? jsonField(fe.getField()) + ": " + fe.getDefaultMessage()
                        : error.getObjectName() + ": " + error.getDefaultMessage())
                .sorted()
                .toList();
        return validation(details);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ErrorResponse> handleMethodValidation(HandlerMethodValidationException ex) {
        List<String> details = ex.getParameterValidationResults().stream()
                .flatMap(result -> {
                    String name = result.getMethodParameter().getParameterName();
                    String field = name != null ? jsonField(name) : "param";
                    return result.getResolvableErrors().stream()
                            .map(MessageSourceResolvable::getDefaultMessage)
                            .map(msg -> field + ": " + msg);
                })
                .sorted()
                .toList();
        return validation(details);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
        List<String> details = ex.getConstraintViolations().stream()
                .map(this::violationDetail)
                .sorted()
                .toList();
        return validation(details);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleNotReadable(HttpMessageNotReadableException ex) {
        return validation(List.of("body: el cuerpo de la petición no es un JSON válido"));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return validation(List.of(jsonField(ex.getName()) + ": valor no válido"));
    }

    private String violationDetail(ConstraintViolation<?> violation) {
        String path = violation.getPropertyPath() != null ? violation.getPropertyPath().toString() : "";
        int dot = path.lastIndexOf('.');
        String field = dot >= 0 ? path.substring(dot + 1) : path;
        return jsonField(field) + ": " + violation.getMessage();
    }

    /** Convierte camelCase a snake_case para que los detalles usen los nombres del contrato JSON. */
    private static String jsonField(String name) {
        return name.replaceAll("([a-z0-9])([A-Z])", "$1_$2").toLowerCase();
    }

    private static ResponseEntity<ErrorResponse> validation(List<String> details) {
        return build(HttpStatus.BAD_REQUEST, VALIDATION_CODE, VALIDATION_MESSAGE, details);
    }

    private static ResponseEntity<ErrorResponse> build(HttpStatus status, String code, String message,
                                                       List<String> details) {
        return ResponseEntity.status(status).body(new ErrorResponse(code, message, details));
    }
}
