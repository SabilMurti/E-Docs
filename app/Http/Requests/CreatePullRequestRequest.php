<?php

namespace App\Http\Requests;

use App\Enums\PullRequestStatus;
use Illuminate\Foundation\Http\FormRequest;

class CreatePullRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $site = $this->route('site');
        return $site && $site->canWrite($this->user());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'source_branch_id' => ['required', 'uuid', 'exists:branches,id'],
            'target_branch_id' => ['required', 'uuid', 'exists:branches,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:' . implode(',', array_column(PullRequestStatus::cases(), 'value'))],
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
            'source_branch_id.required' => 'Source branch is required.',
            'source_branch_id.exists' => 'Source branch does not exist.',
            'target_branch_id.required' => 'Target branch is required.',
            'target_branch_id.exists' => 'Target branch does not exist.',
            'title.required' => 'Pull request title is required.',
        ];
    }
}
