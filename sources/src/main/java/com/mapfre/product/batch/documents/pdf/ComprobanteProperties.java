package com.mapfre.product.batch.documents.pdf;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Configuración del comprobante de vacaciones ({@code documentos.comprobante.*}).
 *
 * @param companyName nombre de la empresa ({@code company_name}, REQ-027); parametrizado por entorno
 * @param pieLegal    texto legal del pie del documento (opcional)
 * @param maxIntentos intentos máximos de generación del PDF (por defecto 2)
 */
@ConfigurationProperties(prefix = "documentos.comprobante")
public record ComprobanteProperties(
        String companyName,
        String pieLegal,
        @DefaultValue("2") int maxIntentos) {
}
