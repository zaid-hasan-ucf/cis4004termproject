import { useState } from 'react'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import './SettingsPage.css'

const DEFAULT_AVATAR =
	'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=420&q=80'

function SectionCard({ title, description, children, danger = false }) {
	return (
		<section className={`card settings-card ${danger ? 'danger' : ''}`}>
			<div className="settings-card-header">
				<h2>{title}</h2>
				{description && <p className="muted settings-description">{description}</p>}
			</div>
			<div className="settings-card-body">{children}</div>
		</section>
	)
}

export default function SettingsPage() {
	const [username, setUsername] = useState('player1')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [profileImage, setProfileImage] = useState(DEFAULT_AVATAR)
	const [previewImage, setPreviewImage] = useState(DEFAULT_AVATAR)
	const [deleteCheck, setDeleteCheck] = useState('')

	return (
		<div className="settings-page">
			<Navbar />

			<div className="container settings-container">
				<header className="settings-header">
					<p className="settings-kicker">Account center</p>
					<h1>Settings</h1>
					<p className="muted">
						Update your account details. These controls are UI-only for now and are not connected to backend actions yet.
					</p>
				</header>

				<div className="settings-grid">
					<SectionCard
						title="Change Username"
						description="Choose the name shown on your profile and reviews."
					>
						<label className="settings-label" htmlFor="username">New username</label>
						<input
							id="username"
							className="field-input"
							type="text"
							placeholder="Enter a new username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
						/>
						<div className="settings-actions">
							<Button>Save Username</Button>
							<Button variant="ghost">Cancel</Button>
						</div>
					</SectionCard>

					<SectionCard
						title="Change Password"
						description="Use a strong password with a mix of letters, numbers, and symbols."
					>
						<label className="settings-label" htmlFor="new-password">New password</label>
						<input
							id="new-password"
							className="field-input"
							type="password"
							placeholder="Enter new password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
						/>

						<label className="settings-label" htmlFor="confirm-password">Confirm new password</label>
						<input
							id="confirm-password"
							className="field-input"
							type="password"
							placeholder="Re-enter new password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
						/>

						<div className="settings-actions">
							<Button>Update Password</Button>
							<Button variant="ghost">Cancel</Button>
						</div>
					</SectionCard>

					<SectionCard
						title="Edit Profile Picture"
						description="Paste an image URL to preview a new avatar before saving."
					>
						<div className="avatar-editor">
							<img src={previewImage} alt="Profile preview" className="settings-avatar-preview" />
							<div className="avatar-fields">
								<label className="settings-label" htmlFor="avatar-url">Profile image URL</label>
								<input
									id="avatar-url"
									className="field-input"
									type="url"
									placeholder="https://example.com/image.jpg"
									value={profileImage}
									onChange={(e) => {
										setProfileImage(e.target.value)
										setPreviewImage(e.target.value || DEFAULT_AVATAR)
									}}
								/>
								<div className="settings-actions">
									<Button>Save Picture</Button>
									<Button
										variant="ghost"
										onClick={() => {
											setProfileImage(DEFAULT_AVATAR)
											setPreviewImage(DEFAULT_AVATAR)
										}}
									>
										Reset
									</Button>
								</div>
							</div>
						</div>
					</SectionCard>

					<SectionCard
						title="Delete Account"
						description="This action is irreversible. Type DELETE to unlock the button."
						danger
					>
						<label className="settings-label" htmlFor="delete-confirm">Type DELETE to confirm</label>
						<input
							id="delete-confirm"
							className="field-input"
							type="text"
							placeholder="DELETE"
							value={deleteCheck}
							onChange={(e) => setDeleteCheck(e.target.value)}
						/>

						<div className="settings-actions">
							<button
								type="button"
								className="danger-action-btn"
								disabled={deleteCheck !== 'DELETE'}
							>
								Delete Account
							</button>
						</div>
					</SectionCard>
				</div>
			</div>
		</div>
	)
}
