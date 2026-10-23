package com.grupo4.enao.service;

import com.grupo4.enao.dto.AuthResponse;
import com.grupo4.enao.dto.ApplicantProfileResponse;
import com.grupo4.enao.dto.ApplicantMapper;
import com.grupo4.enao.dto.LoginRequest;
import com.grupo4.enao.model.Applicant;
import com.grupo4.enao.model.User;
import com.grupo4.enao.repository.ApplicantRepository;
import com.grupo4.enao.repository.UserRepository;
import com.grupo4.enao.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final ApplicantRepository applicantRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getDocNumber(),
                        request.getPassword()
                )
        );

        String token = jwtUtil.generateToken(authentication);

        var applicantOpt = applicantRepository.findByDocNumber(request.getDocNumber());
        if (applicantOpt.isPresent()) {
            Applicant applicant = applicantOpt.get();
            return AuthResponse.builder()
                    .token(token)
                    .type("Bearer")
                    .applicant(ApplicantMapper.toProfile(applicant))
                    .role(applicant.getApplicationData().getStatus() != null ? "APPLICANT" : "APPLICANT")
                    .build();
        }

        User user = userRepository.findByUsername(request.getDocNumber())
                .orElseThrow(() -> new BadCredentialsException("Credenciales inválidas"));

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .role(user.getRole().name())
                .build();
    }
}
