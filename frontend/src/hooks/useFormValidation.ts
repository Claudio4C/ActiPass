import { useState, useCallback, useMemo, useEffect } from 'react'
import { z } from 'zod'

interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  initialValues: T;
  validateOnChange?: boolean;
}

interface UseFormValidationReturn<T> {
  values: T;
  errors: Record<string, string>;
  isValid: boolean;
  setValue: (field: keyof T, value: unknown) => void;
  setError: (field: keyof T, message: string) => void;
  clearError: (field: keyof T) => void;
  clearAllErrors: () => void;
  validate: () => boolean;
  validateField: (field: keyof T) => boolean;
  handleBlur: (field: keyof T) => void;
  handleFocus: (field: keyof T) => void;
  getFieldError: (field: keyof T) => string;
  reset: () => void;
}

export function useFormValidation<T extends Record<string, unknown>>({
  schema,
  initialValues,
  validateOnChange = true,
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const setValue = useCallback((field: keyof T, value: unknown) => {
    setValues(prev => ({ ...prev, [field]: value }))
  }, [])

  const setError = useCallback((field: keyof T, message: string) => {
    setErrors(prev => ({ ...prev, [field as string]: message }))
  }, [])

  const clearError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field as string]
      return newErrors
    })
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors({})
  }, [])

  // Validation d'un champ avec Zod
  const validateField = useCallback((field: keyof T): boolean => {
    try {
      // Valider le champ spécifique avec le schéma complet
      schema.parse(values)
      // Si aucune erreur, effacer l'erreur du champ
      clearError(field)
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Chercher l'erreur pour ce champ spécifique
        const fieldError = error.issues.find(
          issue => issue.path[0] === field,
        )

        if (fieldError) {
          setError(field, fieldError.message)
          return false
        } else {
          // Pas d'erreur pour ce champ
          clearError(field)
          return true
        }
      }
      return false
    }
  }, [schema, values, clearError, setError])

  // Validation en temps réel quand l'utilisateur tape (après avoir touché le champ)
  useEffect(() => {
    if (!validateOnChange) {return}

    const touchedFields = Object.keys(touched).filter(key => touched[key])

    // Valider uniquement les champs touchés
    touchedFields.forEach(field => {
      try {
        // Valider le champ spécifique avec le schéma complet
        schema.parse(values)
        // Si aucune erreur, effacer l'erreur du champ
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Chercher l'erreur pour ce champ spécifique
          const fieldError = error.issues.find(
            issue => issue.path[0] === field,
          )

          if (fieldError) {
            setErrors(prev => ({ ...prev, [field]: fieldError.message }))
          } else {
            // Pas d'erreur pour ce champ
            setErrors(prev => {
              const newErrors = { ...prev }
              delete newErrors[field]
              return newErrors
            })
          }
        }
      }
    })
  }, [values, touched, validateOnChange, schema])

  const handleBlur = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field as string]: true }))
  }, [])

  const handleFocus = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field as string]: true }))
  }, [])

  // Validation complète du formulaire (pour le submit)
  const validate = useCallback((): boolean => {
    try {
      schema.parse(values)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.issues.forEach(err => {
          const field = err.path[0] as string
          newErrors[field] = err.message
        })
        setErrors(newErrors)

        // Marquer tous les champs comme touchés pour afficher toutes les erreurs
        setTouched(prev => {
          const newTouched = { ...prev }
          Object.keys(values).forEach(field => {
            newTouched[field] = true
          })
          return newTouched
        })
      }
      return false
    }
  }, [schema, values])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  const getFieldError = useCallback((field: keyof T): string => {
    // Afficher l'erreur seulement si le champ a été touché
    if (!touched[field as string]) {
      return ''
    }
    return errors[field as string] || ''
  }, [errors, touched])

  // isValid : vérifier si le formulaire est valide sans déclencher de validation
  const isValid = useMemo(() => {
    // Pas d'erreurs visibles
    if (Object.keys(errors).length > 0) {return false}

    // Vérifier rapidement si le schéma est satisfait sans setter d'erreurs
    try {
      schema.parse(values)
      return true
    } catch {
      return false
    }
  }, [errors, values, schema])

  return {
    values,
    errors,
    isValid,
    setValue,
    setError,
    clearError,
    clearAllErrors,
    validate,
    validateField,
    handleBlur,
    handleFocus,
    getFieldError,
    reset,
  }
}
