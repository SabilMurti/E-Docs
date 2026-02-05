<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMemberRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'role' => ['required', 'in:editor,viewer'],
        ];
    }

    public function messages(): array
    {
        return [
            'role.required' => 'Role is required.',
            'role.in' => 'Role must be either editor or viewer.',
        ];
    }
}
