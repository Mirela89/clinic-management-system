package com.medicareplus.security;

import com.medicareplus.common.dto.AppResponse;
import com.medicareplus.user.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Inregistrare utilizator nou
    @PostMapping("/register")
    public ResponseEntity<AppResponse<Void>> register(
            @Valid @RequestBody RegisterRequest request) {

        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(AppResponse.error("Username already in use."));
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(AppResponse.error("Email already in use."));
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setRole(UserRole.PATIENT); // default role la inregistrare

        userRepository.save(user);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(AppResponse.success("User registered successfully.", null));
    }

    // Returneaza datele utilizatorului autentificat curent
    @GetMapping("/me")
    public ResponseEntity<AppResponse<UserInfoResponse>> getCurrentUser() {
        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(AppResponse.error("Not authenticated."));
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow();

        UserInfoResponse userInfo = new UserInfoResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getRole().name()
        );

        return ResponseEntity.ok(AppResponse.success(userInfo));
    }
}