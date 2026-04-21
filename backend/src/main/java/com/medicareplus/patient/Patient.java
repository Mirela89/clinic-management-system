package com.medicareplus.patient;

import com.medicareplus.appointment.Appointment;
import com.medicareplus.insurance.Insurance;
import com.medicareplus.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "patients")
@Getter
@Setter
public class Patient {

    @Id
    private Long userId;

    @MapsId
    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @NotBlank
    @Pattern(regexp = "\\d{13}", message = "CNP must be exactly 13 digits")
    @Column(nullable = false, unique = true)
    private String cnp;

    @NotNull
    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Column
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(name = "blood_type")
    private BloodType bloodType;

    @ManyToOne
    @JoinColumn(name = "insurance_id")
    private Insurance insurance;

    // Relatii inverse
    @OneToMany(mappedBy = "patient")
    private List<Appointment> appointments;
}
