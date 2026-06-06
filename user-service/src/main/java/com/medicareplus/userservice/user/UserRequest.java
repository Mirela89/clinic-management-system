package com.medicareplus.userservice.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRequest {

    @NotBlank(message = "Username is required.")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters.")
    private String username;

    @Size(min = 6, message = "Password must be at least 6 characters.")
    private String password;

    @Email(message = "Invalid email address.")
    @NotBlank(message = "Email is required.")
    private String email;

    @NotBlank(message = "First name is required.")
    private String firstName;

    @NotBlank(message = "Last name is required.")
    private String lastName;

    private String phone;

    @NotNull(message = "Role is required.")
    private UserRole role;
}