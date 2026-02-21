<?php

namespace App\Http\Requests;

use App\Enums\BranchName;
use Illuminate\Foundation\Http\FormRequest;

class CreateBranchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $site = $this->route('site');
        return $site && $site->canEdit($this->user());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'source_branch' => ['required', 'string', 'exists:branches,name'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if (BranchName::isReserved($this->input('name'))) {
                $validator->errors()->add('name', 'Branch name "' . $this->input('name') . '" is reserved.');
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Branch name is required.',
            'source_branch.required' => 'Source branch is required.',
            'source_branch.exists' => 'Source branch does not exist.',
        ];
    }
}
