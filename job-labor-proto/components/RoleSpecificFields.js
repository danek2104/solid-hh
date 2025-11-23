import React from 'react';
import { Text, TextInput } from 'react-native';
import { styles } from '../AppStyles';

const RoleSpecificFields = ({ authRole, authForm, handleFormChange }) => (
    authRole === 'worker' ? (
        <>
            <Text style={styles.authSubLabel}>Профиль работника</Text>
            <TextInput
                placeholder="Основной навык (маляр, сварщик и т.д.)"
                placeholderTextColor="#BDBDBD"
                style={styles.authInput}
                value={authForm.workerSkill}
                onChangeText={(text) => handleFormChange('workerSkill', text)}
            />
            <TextInput
                placeholder="Когда можете работать? (например, ночные смены)"
                placeholderTextColor="#BDBDBD"
                style={styles.authInput}
                value={authForm.workerAvailability}
                onChangeText={(text) => handleFormChange('workerAvailability', text)}
            />
        </>
    ) : (
        <>
            <Text style={styles.authSubLabel}>Данные работодателя</Text>
            <TextInput
                placeholder="Название компании / объекта"
                placeholderTextColor="#BDBDBD"
                style={styles.authInput}
                value={authForm.employerCompany}
                onChangeText={(text) => handleFormChange('employerCompany', text)}
            />
            <TextInput
                placeholder="Контакт для связи (телеграм, телефон)"
                placeholderTextColor="#BDBDBD"
                style={styles.authInput}
                value={authForm.employerContact}
                onChangeText={(text) => handleFormChange('employerContact', text)}
            />
        </>
    )
);

export default RoleSpecificFields;
