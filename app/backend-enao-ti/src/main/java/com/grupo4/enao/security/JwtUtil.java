package com.grupo4.enao.security;

import com.grupo4.enao.dto.UserPrincipal;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.stream.Collectors;

@Slf4j
@Component
public class JwtUtil {

    @Value("${enao.jwt.secret}")
    private String jwtSecret;

    @Value("${enao.jwt.expiration-ms}")
    private long jwtExpirationMs;

    private SecretKey key() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return generateTokenFromUserDetails(userDetails);
    }

    public String generateTokenFromUserDetails(UserDetails userDetails) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtExpirationMs);

        String authorities = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        String role = "APPLICANT";
        boolean isApplicant = true;
        if (userDetails instanceof UserPrincipal principal) {
            role = principal.getRole().name();
            isApplicant = principal.isApplicant();
        }

        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("authorities", authorities)
                .claim("role", role)
                .claim("isApplicant", isApplicant)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key(), Jwts.SIG.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isApplicant(String token) {
        Claims claims = parseClaims(token);
        Object value = claims.get("isApplicant");
        return value == null || Boolean.parseBoolean(value.toString());
    }

    public Claims getClaims(String token) {
        return parseClaims(token);
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (MalformedJwtException e) {
            log.error("Token JWT mal formado: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("Token JWT expirado: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("Token JWT no soportado: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("Cadena JWT vacía o nula: {}", e.getMessage());
        }
        return false;
    }

    private boolean isTokenExpired(String token) {
        return parseClaims(token).getExpiration().before(new Date());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
