package com.medicareplus.insurance;

import com.medicareplus.common.model.BaseEntity;
import com.medicareplus.patient.Patient;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "insurances")
@Getter
@Setter
public class Insurance extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "provider_name", nullable = false)
    private String providerName;

    @NotBlank
    @Column(name = "policy_number", nullable = false, unique = true)
    private String policyNumber;

    @NotNull
    @Min(0)
    @Max(100)
    @Column(name = "coverage_percentage", nullable = false)
    private Double coveragePercentage;

    @NotNull
    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    // Un pacient poate avea o singura asigurare, dar o asigurare poate fi asociata cu mai multi pacienti
    @OneToMany(mappedBy = "insurance")
    private List<Patient> patients;
}
