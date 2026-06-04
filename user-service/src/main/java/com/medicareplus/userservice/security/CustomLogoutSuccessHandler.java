package com.medicareplus.userservice.security;

import com.medicareplus.userservice.audit.AuditAction;
import com.medicareplus.userservice.audit.AuditLogService;
import com.medicareplus.userservice.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class CustomLogoutSuccessHandler implements LogoutSuccessHandler {

    private final AuditLogService auditLogService;
    private final UserRepository userRepository;

    @Override
    public void onLogoutSuccess(HttpServletRequest request,
                                HttpServletResponse response,
                                Authentication authentication) throws IOException {
        // Loghează logout dacă userul era autentificat
        if (authentication != null) {
            userRepository.findByUsername(authentication.getName()).ifPresent(user -> {
                auditLogService.log(
                        user.getId(),
                        AuditAction.LOGOUT,
                        "User",
                        user.getId(),
                        "User logged out: " + user.getUsername(),
                        request.getRemoteAddr()
                );
            });
        }

        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType("application/json");
        response.getWriter().write(
                "{\"success\": true, \"message\": \"Logout successful.\"}"
        );
    }
}