package com.mapfre.product.batch.documents.pdf;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Objects;

/**
 * Documento PDF generado: nombre de fichero y contenido binario.
 *
 * @param nombreFichero nombre del fichero PDF
 * @param contenido     bytes del PDF
 */
public record DocumentoPdf(String nombreFichero, byte[] contenido) {

    /** Content type de los documentos PDF. */
    public static final String CONTENT_TYPE = "application/pdf";

    /** Abre un stream de lectura sobre el contenido del PDF. */
    public InputStream abrirStream() {
        return new ByteArrayInputStream(contenido);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof DocumentoPdf other)) {
            return false;
        }
        return Objects.equals(nombreFichero, other.nombreFichero)
                && Arrays.equals(contenido, other.contenido);
    }

    @Override
    public int hashCode() {
        return 31 * Objects.hashCode(nombreFichero) + Arrays.hashCode(contenido);
    }

    @Override
    public String toString() {
        return "DocumentoPdf[nombreFichero=" + nombreFichero
                + ", bytes=" + (contenido == null ? 0 : contenido.length) + "]";
    }
}
