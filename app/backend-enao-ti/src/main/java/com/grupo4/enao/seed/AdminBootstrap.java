package com.grupo4.enao.seed;

import com.grupo4.enao.model.Role;
import com.grupo4.enao.model.User;
import com.grupo4.enao.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creacion del usuario administrador en el primer arranque.
 *
 * Es independiente del DataSeeder: en el despliegue con contenedores el
 * sembrado de datos esta apagado (ENAO_SEED_ENABLED=false), de modo que sin
 * esto el personal no podria autenticarse y los flujos administrativos
 * (revision de documentos y reportes de RF-08) quedarian inaccesibles.
 *
 * Es idempotente: solo crea el usuario si no existe ninguno, y si la
 * contrasena no llega por variable de entorno no crea nada y avisa.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrap implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${enao.admin-bootstrap.enabled:true}")
    private boolean enabled;

    @Value("${enao.admin-bootstrap.username:admin}")
    private String username;

    @Value("${enao.admin-bootstrap.password:}")
    private String password;

    @Override
    public void run(String... args) {
        if (!enabled || !isSet(password)) {
            log.warn("bootstrap del administrador no configurado: define "
                    + "ENAO_ADMIN_BOOTSTRAP_PASSWORD para poder usar el panel "
                    + "administrativo (revision y reportes).");
            return;
        }
        if (userRepository.count() > 0) {
            return;
        }
        userRepository.save(User.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(password))
                .fullName("Administrador ASPEFO")
                .role(Role.ADMIN)
                .build());
        log.info("usuario '{}' creado en el primer arranque (bootstrap administrativo)", username);
    }

    private boolean isSet(String value) {
        return value != null && !value.isBlank();
    }
}