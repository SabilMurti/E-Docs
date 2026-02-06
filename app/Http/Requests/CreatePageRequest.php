<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreatePageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'exists:pages,id'],
            'content' => ['nullable', 'array'],
            'is_published' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Page title is required.',
            'parent_id.exists' => 'Parent page does not exist.',
        ];
    }
}
