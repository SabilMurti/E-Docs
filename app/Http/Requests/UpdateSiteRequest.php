<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSiteRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'logo_url' => ['nullable', 'url'],
            'settings' => ['nullable', 'array'],
            'settings.theme' => ['nullable', 'string', 'in:light,dark,auto'],
            'settings.accent_color' => ['nullable', 'string'],
            'settings.show_footer' => ['nullable', 'boolean'],
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
            'name.required' => 'Site name is required.',
            'logo_url.url' => 'Logo URL must be a valid URL.',
        ];
    }
}
