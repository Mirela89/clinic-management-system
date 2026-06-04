package com.medicareplus.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsServiceImpl;
    private final LoginSuccessHandler loginSuccessHandler;
    private final LoginFailureHandler loginFailureHandler;
    private final LogoutSuccessHandler logoutSuccessHandler;

    // BCrypt pentru criptarea parolelor
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Authentication provider cu JDBC (UserDetailsService + BCrypt)
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsServiceImpl);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    // Authentication manager - necesar pentru login manual
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // CORS - permite requesturi din React (localhost:3000)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://localhost:5173"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true); // necesar pentru cookies de sesiune
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // CSRF - folosim cookie pentru compatibilitate cu React
//                .csrf(csrf -> csrf
//                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
//                        .ignoringRequestMatchers("/api/auth/**") // exceptam doar auth endpoints
//                )
                .csrf(csrf -> csrf.disable()) // TEMPORAR

                // Autorizare endpoint-uri
                .authorizeHttpRequests(auth -> auth
                        // Swagger
                        .requestMatchers("/swagger-ui/**", "/api-docs/**", "/swagger-ui.html", "/webjars/**").permitAll()

                        // Endpoint-uri publice
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()

                        // Endpoint-uri specifice patient
                        .requestMatchers(HttpMethod.GET, "/api/consultations/patient/*").hasAnyRole("PATIENT", "DOCTOR", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/prescriptions/patient/*").hasAnyRole("PATIENT", "DOCTOR", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/analyses/patient/*").hasAnyRole("PATIENT", "DOCTOR", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/analysis-documents/patient/*").hasAnyRole("PATIENT", "DOCTOR", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/appointments/*/cancel").hasAnyRole("PATIENT", "DOCTOR", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/notifications/*/read").authenticated()

                        // GET-uri accesibile tuturor
                        .requestMatchers(HttpMethod.GET, "/api/insurances").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/departments").authenticated()

                        // Endpoint-uri admin
                        .requestMatchers("/api/users/**").hasRole("ADMIN")
                        .requestMatchers("/api/departments/**").hasRole("ADMIN")
                        .requestMatchers("/api/insurances/**").hasRole("ADMIN")
                        .requestMatchers("/api/audit/**").hasRole("ADMIN")

                        // Endpoint-uri doctor
                        .requestMatchers("/api/consultations/**").hasAnyRole("DOCTOR", "ADMIN")
                        .requestMatchers("/api/prescriptions/**").hasAnyRole("DOCTOR", "ADMIN")
                        .requestMatchers("/api/medications/**").hasAnyRole("DOCTOR", "ADMIN")
                        .requestMatchers("/api/analyses/**").hasAnyRole("DOCTOR", "ADMIN")
                        .requestMatchers("/api/analysis-documents/**").hasAnyRole("DOCTOR", "ADMIN")

                        // Endpoint-uri accesibile de toti utilizatorii autentificati
                        .requestMatchers("/api/appointments/**").authenticated()
                        .requestMatchers("/api/doctors/**").authenticated()
                        .requestMatchers("/api/patients/**").authenticated()
                        .requestMatchers("/api/notifications/**").authenticated()
                        .requestMatchers("/api/doctor-schedules/**").authenticated()

                        // Orice alt request necesita autentificare
                        .anyRequest().authenticated()
                )

                // Formular de login adaptat pentru React (returneaza JSON)
                .formLogin(form -> form
                        .loginProcessingUrl("/api/auth/login")
                        .successHandler(loginSuccessHandler)
                        .failureHandler(loginFailureHandler)
                )

                // Logout adaptat pentru React
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .logoutSuccessHandler(logoutSuccessHandler)
                        .deleteCookies("JSESSIONID")
                        .invalidateHttpSession(true)
                )

                // Remember Me
                .rememberMe(remember -> remember
                        .key("medicare-plus-remember-me-key")
                        .tokenValiditySeconds(7 * 24 * 60 * 60) // 7 zile
                        .userDetailsService(userDetailsServiceImpl)
                )

                // Erori de autentificare/autorizare returnate ca JSON
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(
                                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)
                        )
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpStatus.FORBIDDEN.value());
                            response.setContentType("application/json");
                            response.getWriter().write(
                                    "{\"success\": false, \"message\": \"Access denied.\"}"
                            );
                        })
                )

                .authenticationProvider(authenticationProvider());

        return http.build();
    }
}