import type { HandleClientError } from '@sveltejs/kit/hooks';

/**
 * Kit hides the message of unknown errors in production ("Internal Error"). This app runs
 * entirely on the user's device with no secrets, so the real message is more useful in
 * the error panel's "copy debug info" (CLAUDE.md §4). Framework and app errors keep
 * their own status and message.
 */
export const handleError: HandleClientError = ({ kind, error }) => {
	if (kind === 'unknown') {
		return { message: error instanceof Error ? error.message : String(error) };
	}
	return;
};
