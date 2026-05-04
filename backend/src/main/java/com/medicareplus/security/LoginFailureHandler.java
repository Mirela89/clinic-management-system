package com.medicareplus.security;

import com.medicareplus.audit.AuditAction;
import com.medicareplus.audit.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class LoginFailureHandler implements AuthenticationFailureHandler {

    private final AuditLogService auditLogService;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        // Loghează tentativa eșuată
        String username = request.getParameter("username");
        auditLogService.log(
                null,
                AuditAction.ACCESS_DENIED,
                "User",
                null,
                "Failed login attempt for username: " + username,
                request.getRemoteAddr()
        );

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write(
                "{\"success\": false, \"message\": \"Invalid username or password.\"}"
        );
    }
}