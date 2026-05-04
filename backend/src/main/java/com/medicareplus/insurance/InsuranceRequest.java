package com.medicareplus.insurance;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class InsuranceRequest {

    @NotBlank(message = "Provider name is required.")
    private String providerName;

    @NotBlank(message = "Policy number is required.")
    private String policyNumber;

    @NotNull(message = "Coverage percentage is required.")
    @DecimalMin(value = "0.0", message = "Coverage percentage must be at least 0.")
    @DecimalMax(value = "100.0", message = "Coverage percentage must be at most 100.")
    private Double coveragePercentage;

    @NotNull(message = "Expiry date is required.")
    private LocalDate expiryDate;
}
