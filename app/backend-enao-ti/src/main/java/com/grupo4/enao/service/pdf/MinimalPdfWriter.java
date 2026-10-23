package com.grupo4.enao.service.pdf;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Generador minimalista de PDF, sin dependencias externas.
 *
 * Genera un documento de una pagina con la fuente Helvetica (una de las 14
 * fuentes estandar de PDF, que no requiere incrustacion), usando el
 * WinAnsiEncoding, de modo que las letras acentuadas del espanol se
 * escriben correctamente. Es suficiente para el comprobante de inscripcion
 * (RF-04) y para la exportacion PDF de los reportes (RF-08), y evita el
 * riesgo de licencia de iText y la dependencia pesada de JasperReports.
 */
public final class MinimalPdfWriter {

    private static final float PAGE_WIDTH = 595.28f;
    private static final float PAGE_HEIGHT = 841.89f;
    private static final float MARGIN = 56f;
    private static final float MAX_Y = PAGE_HEIGHT - MARGIN - 10f;
    private static final float MIN_Y = MARGIN + 40f;

    private static final String TEXT_FONT = "/F1";
    private static final String BOLD_FONT = "/F2";

    private final ArrayList<Line> lines = new ArrayList<>();

    private MinimalPdfWriter() {
    }

    public static Builder builder() {
        return new Builder();
    }

    public enum Style {
        TITLE, SUBTITLE, HEADING, NORMAL, BOLD, FOOTER, RULE
    }

    private record Line(Style style, String text) {
    }

    public static final class Builder {
        private final MinimalPdfWriter writer = new MinimalPdfWriter();

        public Builder title(String text) {
            return line(Style.TITLE, text);
        }

        public Builder subtitle(String text) {
            return line(Style.SUBTITLE, text);
        }

        public Builder heading(String text) {
            return line(Style.HEADING, text);
        }

        public Builder line(String text) {
            return line(Style.NORMAL, text);
        }

        public Builder bold(String text) {
            return line(Style.BOLD, text);
        }

        public Builder line(Style style, String text) {
            writer.lines.add(new Line(style, text == null ? "" : text));
            return this;
        }

        public Builder footer(String text) {
            return line(Style.FOOTER, text);
        }

        public Builder separator() {
            writer.lines.add(new Line(Style.RULE, ""));
            return this;
        }

        public byte[] build() {
            try {
                return writer.render();
            } catch (IOException e) {
                throw new IllegalStateException("no se pudo generar el PDF", e);
            }
        }
    }

    private byte[] render() throws IOException {
        ByteArrayOutputStream content = new ByteArrayOutputStream();
        float y = MAX_Y;

        for (int i = 0; i < lines.size() && y >= MIN_Y; i++) {
            Line ln = lines.get(i);
            float size = fontSize(ln.style());
            if (ln.style() == Style.RULE) {
                y = advance(y, 6f);
                content.writeBytes(("0.4 w 1 J " + MARGIN + " m " + (PAGE_WIDTH - MARGIN) + " " + y + " l S\n")
                        .getBytes(StandardCharsets.US_ASCII));
                y = advance(y, 10f);
                continue;
            }
            String text = escape(ln.text());
            if (text.isEmpty()) {
                y = advance(y, 6f);
                continue;
            }
            String font = ln.style() == Style.TITLE || ln.style() == Style.HEADING || ln.style() == Style.BOLD
                    ? BOLD_FONT : TEXT_FONT;
            float x = MARGIN;
            if (ln.style() == Style.TITLE || ln.style() == Style.SUBTITLE) {
                x = center(text, size, font);
            }
            content.writeBytes(("BT " + font + " " + size + " Tf " + round(x) + " " + round(y) + " Td (" + text + ") Tj ET\n")
                    .getBytes(StandardCharsets.US_ASCII));
            y = advance(y, size + 4f);
        }

        byte[] contentBytes = content.toByteArray();

        int[] objectOffset = new int[7];
        java.io.ByteArrayOutputStream pdf = new ByteArrayOutputStream();
        pdf.write("%PDF-1.4\n".getBytes(StandardCharsets.US_ASCII));
        pdf.write(new byte[]{0x25, (byte) 0xe2, (byte) 0xe3, (byte) 0xcf, (byte) 0xd3, 0x0a});

        objectOffset[1] = pdf.size();
        pdf.write("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n".getBytes(StandardCharsets.US_ASCII));

        objectOffset[2] = pdf.size();
        pdf.write("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n".getBytes(StandardCharsets.US_ASCII));

        objectOffset[3] = pdf.size();
        pdf.write(("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + PAGE_WIDTH + " " + PAGE_HEIGHT
                + "] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n")
                .getBytes(StandardCharsets.US_ASCII));

        objectOffset[4] = pdf.size();
        pdf.write("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n"
                .getBytes(StandardCharsets.US_ASCII));

        objectOffset[5] = pdf.size();
        pdf.write("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n"
                .getBytes(StandardCharsets.US_ASCII));

        objectOffset[6] = pdf.size();
        pdf.write(("6 0 obj\n<< /Length " + contentBytes.length + " >>\nstream\n").getBytes(StandardCharsets.US_ASCII));
        pdf.write(contentBytes);
        pdf.write("endstream\nendobj\n".getBytes(StandardCharsets.US_ASCII));

        int xrefOffset = pdf.size();
        StringBuilder xref = new StringBuilder();
        xref.append("xref\n0 7\n");
        xref.append("0000000000 65535 f \n");
        for (int i = 1; i <= 6; i++) {
            xref.append(String.format("%010d 00000 n \n", objectOffset[i]));
        }
        xref.append("trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n").append(xrefOffset).append("\n%%EOF\n");
        pdf.write(xref.toString().getBytes(StandardCharsets.US_ASCII));

        return pdf.toByteArray();
    }

    private static float fontSize(Style style) {
        return switch (style) {
            case TITLE -> 16f;
            case SUBTITLE -> 12f;
            case HEADING -> 12f;
            case BOLD -> 10f;
            case FOOTER -> 8f;
            default -> 9.5f;
        };
    }

    private static float advance(float y, float delta) {
        return y - delta;
    }

    // ancho aproximado para centrar; suficiente para una plantilla fija
    private static float center(String text, float size, String font) {
        float width = text.length() * size * (font.endsWith("Bold") ? 0.56f : 0.50f);
        return Math.max(MARGIN, (PAGE_WIDTH - width) / 2f);
    }

    private static String round(float value) {
        return String.valueOf(Math.round(value));
    }

    /** sustituye los caracteres no representables por un equivalente ascii. */
    private static String escape(String text) {
        StringBuilder sb = new StringBuilder(text.length());
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            switch (c) {
                case '(' -> sb.append("\\(");
                case ')' -> sb.append("\\)");
                case '\\' -> sb.append("\\\\");
                case '\r', '\n', '\t' -> { }
                default -> {
                    if (c >= 32 && c <= 255) {
                        sb.append(c);
                    } else {
                        sb.append(' ');
                    }
                }
            }
        }
        return sb.toString();
    }
}