<?php

namespace App\Http\Requests;

use App\Enums\PullRequestReviewStatus;
use Illuminate\Foundation\Http\FormRequest;

class SubmitPullRequestReviewRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $site = $this->route('site');
        return $site && $site->canView($this->user());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'in:' . implode(',', array_column(PullRequestReviewStatus::cases(), 'value'))],
            'body' => ['nullable', 'string'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'status.required' => 'Review status is required.',
            'status.in' => 'Invalid review status. Must be one of: ' . implode(', ', array_column(PullRequestReviewStatus::cases(), 'value')),
        ];
    }
}
