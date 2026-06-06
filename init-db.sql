SELECT 'CREATE DATABASE medicare_users'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'medicare_users')\gexec

SELECT 'CREATE DATABASE medicare_medical'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'medicare_medical')\gexec

SELECT 'CREATE DATABASE medicare_notifications'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'medicare_notifications')\gexec