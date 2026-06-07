package com.medicareplus.userservice.common;

import com.medicareplus.userservice.user.User;
import com.medicareplus.userservice.user.UserRepository;
import com.medicareplus.userservice.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("password123"));
            admin.setEmail("admin@medicare.com");
            admin.setFirstName("Admin");
            admin.setLastName("User");
            admin.setRole(UserRole.ADMIN);
            userRepository.save(admin);
            System.out.println("Admin user created successfully.");
        }
    }
}