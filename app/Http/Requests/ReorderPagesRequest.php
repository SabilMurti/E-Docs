<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReorderPagesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'pages' => ['required', 'array', 'min:1'],
            'pages.*.id' => ['required', 'exists:pages,id'],
            'pages.*.order' => ['required', 'integer', 'min:0'],
            'pages.*.parent_id' => ['nullable', 'exists:pages,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'pages.required' => 'Pages array is required.',
            'pages.*.id.required' => 'Page ID is required.',
            'pages.*.id.exists' => 'Page does not exist.',
            'pages.*.order.required' => 'Page order is required.',
            'pages.*.order.integer' => 'Page order must be an integer.',
        ];
    }
}
