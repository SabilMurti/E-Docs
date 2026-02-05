<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateSpaceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'visibility' => ['in:public,private'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:spaces,slug'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Space name is required.',
            'visibility.in' => 'Visibility must be either public or private.',
            'slug.unique' => 'This slug is already taken.',
        ];
    }
}
