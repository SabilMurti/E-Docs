<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreatePageRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'parent_id' => [
                'nullable', 
                'exists:pages,id',
                // Validate parent belongs to same site and branch
                function ($attribute, $value, $fail) {
                    if ($value) {
                        $parent = \App\Models\Page::find($value);
                        if ($parent) {
                            $site = $this->route('site');
                            $branchName = $this->input('branch', 'main');
                            $branch = $site?->branches()->where('name', $branchName)->first();
                            
                            if ($parent->site_id !== $site?->id) {
                                $fail('Parent page must belong to the same site.');
                            }
                            if ($branch && $parent->branch_id !== $branch->id) {
                                $fail('Parent page must belong to the same branch.');
                            }
                        }
                    }
                }
            ],
            'content' => ['nullable', 'array'],
            'branch' => ['nullable', 'string', 'exists:branches,name'],
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
            'title.required' => 'Page title is required.',
            'parent_id.exists' => 'Parent page does not exist.',
            'branch.exists' => 'Selected branch does not exist.',
        ];
    }
}
