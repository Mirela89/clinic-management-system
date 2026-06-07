package com.medicareplus.discovery;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DiscoveryServerApplicationTest {

    @Test
    void applicationClassExists() {
        assertThat(DiscoveryServerApplication.class).isNotNull();
    }
}
