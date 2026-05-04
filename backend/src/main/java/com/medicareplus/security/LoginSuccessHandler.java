package com.medicareplus.security;

import com.medicareplus.audit.AuditAction;
import com.medicareplus.audit.AuditLogService;
import com.medicareplus.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final AuditLogService auditLogService;
    private final UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        // Loghează login
        userRepository.findByUsername(authentication.getName()).ifPresent(user -> {
            auditLogService.log(
                    user.getId(),
                    AuditAction.LOGIN,
                    "User",
                    user.getId(),
                    "User logged in: " + user.getUsername(),
                    request.getRemoteAddr()
            );
        });

        // Răspuns JSON
        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType("application/json");
        response.getWriter().write(
                "{\"success\": true, \"message\": \"Login successful\", " +
                        "\"role\": \"" + authentication.getAuthorities()
                        .iterator().next().getAuthority() + "\"}"
        );
    }
}