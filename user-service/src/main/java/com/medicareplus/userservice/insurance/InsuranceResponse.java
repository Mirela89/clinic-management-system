package com.medicareplus.userservice.insurance;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class InsuranceResponse {

    private Long id;
    private String providerName;
    private String policyNumber;
    private Double coveragePercentage;
    private LocalDate expiryDate;
    private Integer patientCount;
}
