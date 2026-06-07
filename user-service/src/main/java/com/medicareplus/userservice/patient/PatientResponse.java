package com.medicareplus.userservice.patient;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PatientResponse {

    private Long userId;
    private PatientUserInfo user;
    private String cnp;
    private LocalDate dateOfBirth;
    private String address;
    private String bloodType;
    private Long insuranceId;
    private String insuranceProviderName;
}
