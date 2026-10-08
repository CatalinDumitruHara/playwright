package com.mapfre.product.batch.documents.pdf;

/**
 * Plantilla corporativa {@code doc_pdf_generic} para documentos PDF.
 */
public final class PlantillaDocPdfGeneric {

    /** Código de la plantilla ({@code template_code}). */
    public static final String TEMPLATE_CODE = "doc_pdf_generic";

    /** HTML de la plantilla; no modificar. */
    public static final String HTML = "<!DOCTYPE html><html><head><meta charset='utf-8'/><style>@page{size:A4;margin:2cm}body{font-family:Arial,sans-serif;color:#333;font-size:12pt}h1{color:#c8102e;font-size:18pt}.meta{color:#666;font-size:10pt;margin-bottom:24px}.footer{margin-top:40px;font-size:9pt;color:#888;border-top:1px solid #ddd;padding-top:8px}</style></head><body><h1>{{titulo}}</h1><div class=\"meta\">Ref: {{referencia}} · Fecha: {{fecha}}</div><div>{{cuerpo}}</div><div class=\"footer\">{{pie_legal}}</div></body></html>";

    private PlantillaDocPdfGeneric() {
    }

    /**
     * Rellena la plantilla sustituyendo solo las variables {@code {{clave}}}.
     * titulo, referencia, fecha y pieLegal se escapan; {@code cuerpoHtml} se inserta tal cual
     * (el llamante escapa sus valores y garantiza XHTML bien formado).
     *
     * @throws IllegalArgumentException si titulo, referencia, fecha o cuerpoHtml son nulos o vacíos
     */
    public static String renderizar(String titulo, String referencia, String fecha,
                                    String cuerpoHtml, String pieLegal) {
        requerido(titulo, "titulo");
        requerido(referencia, "referencia");
        requerido(fecha, "fecha");
        requerido(cuerpoHtml, "cuerpo");
        // Sustitución en una sola pasada para que los valores no reinterpreten otras claves.
        String[] claves = {"{{titulo}}", "{{referencia}}", "{{fecha}}", "{{cuerpo}}", "{{pie_legal}}"};
        String[] valores = {escapar(titulo), escapar(referencia), escapar(fecha), cuerpoHtml,
                pieLegal == null ? "" : escapar(pieLegal)};
        StringBuilder sb = new StringBuilder(HTML.length() + cuerpoHtml.length() + 256);
        int i = 0;
        while (i < HTML.length()) {
            boolean sustituido = false;
            if (HTML.startsWith("{{", i)) {
                for (int k = 0; k < claves.length; k++) {
                    if (HTML.startsWith(claves[k], i)) {
                        sb.append(valores[k]);
                        i += claves[k].length();
                        sustituido = true;
                        break;
                    }
                }
            }
            if (!sustituido) {
                sb.append(HTML.charAt(i));
                i++;
            }
        }
        return sb.toString();
    }

    /** Escapa un texto para XML/XHTML ({@code & < > " '}). Null devuelve cadena vacía. */
    public static String escapar(String texto) {
        if (texto == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder(texto.length() + 16);
        for (int i = 0; i < texto.length(); i++) {
            char c = texto.charAt(i);
            switch (c) {
                case '&' -> sb.append("&amp;");
                case '<' -> sb.append("&lt;");
                case '>' -> sb.append("&gt;");
                case '"' -> sb.append("&quot;");
                case '\'' -> sb.append("&apos;");
                default -> sb.append(c);
            }
        }
        return sb.toString();
    }

    private static void requerido(String valor, String nombre) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException(nombre + " es obligatorio");
        }
    }
}
