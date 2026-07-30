import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getProfile, updateProfile } from '../api/users'
import { Field } from '../components/Field'
import { Spinner, LoadingBlock } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'
import { SecuritySettings } from '../components/SecuritySettings'
import { useToast } from '../toast/ToastContext'
import { errorMessage } from '../api/client'

export default function Profile() {
  const qc = useQueryClient()
  const toast = useToast()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const { data: user, isLoading, isError, error: loadError } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  useEffect(() => {
    if (user) setName(user.name)
  }, [user])

  const save = useMutation({
    mutationFn: (newName: string) => updateProfile(newName),
    onSuccess: (updated) => {
      qc.setQueryData(['profile'], updated)
      qc.setQueryData(['auth', 'me'], updated)
      toast.success('Profile updated')
    },
  })

  if (isLoading) return <LoadingBlock label="Loading profile…" />
  if (isError || !user) {
    return <EmptyState title="Couldn't load profile" message={errorMessage(loadError)} />
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Name is required')
      return
    }
    setError('')
    save.mutate(trimmed)
  }

  const dirty = name.trim() !== user.name

  return (
    <div className="profile-page">
      <h1 className="page-title">Your profile</h1>

      <div className="card profile-card">
        <form onSubmit={onSubmit} noValidate className="auth-form">
          <Field label="Name" error={error}>
            {({ id, describedBy }) => (
              <input
                id={id}
                aria-describedby={describedBy}
                className="input"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
          </Field>

          <Field label="Email" hint="Email can't be changed in this demo.">
            {({ id }) => (
              <input
                id={id}
                className="input"
                type="email"
                value={user.email}
                disabled
                readOnly
              />
            )}
          </Field>

          <Field label="Role">
            {({ id }) => (
              <input
                id={id}
                className="input"
                type="text"
                value={user.role}
                disabled
                readOnly
              />
            )}
          </Field>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={!dirty || save.isPending}
          >
            {save.isPending ? <Spinner label="Saving" /> : 'Save changes'}
          </button>
        </form>
      </div>

      <SecuritySettings />
    </div>
  )
}
