package com.grupo4.enao.security;

import com.grupo4.enao.dto.UserPrincipal;
import com.grupo4.enao.model.Applicant;
import com.grupo4.enao.model.Role;
import com.grupo4.enao.model.User;
import com.grupo4.enao.repository.ApplicantRepository;
import com.grupo4.enao.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final ApplicantRepository applicantRepository;
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // First try to find an applicant
        var applicantOpt = applicantRepository.findByDocNumber(username);
        if (applicantOpt.isPresent()) {
            Applicant applicant = applicantOpt.get();
            return new UserPrincipal(
                    applicant.getDocNumber(),
                    applicant.getPasswordHash(),
                    Role.APPLICANT,
                    true
            );
        }

        // Then try internal users (admin / maintainer)
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Usuario no encontrado: " + username));

        return new UserPrincipal(
                user.getUsername(),
                user.getPasswordHash(),
                user.getRole(),
                false
        );
    }
}
