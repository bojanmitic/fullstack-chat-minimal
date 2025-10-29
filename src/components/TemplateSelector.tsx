"use client";

import { useState, useEffect } from "react";
import { PREDEFINED_TEMPLATES, getTemplatesByCategory, getTemplateCategories } from "@/lib/templates";
import { PromptTemplate, TemplateCategory } from "@/types";
import { templateEngine } from "@/lib/templateEngine";

interface TemplateSelectorProps {
  onTemplateSelect: (templateId: string | undefined, variables: Record<string, string | number | boolean>) => void;
  selectedTemplateId?: string;
  className?: string;
}

export function TemplateSelector({ 
  onTemplateSelect, 
  selectedTemplateId, 
  className = "" 
}: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showVariables, setShowVariables] = useState(false);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string | number | boolean>>({});

  const selectedTemplate = selectedTemplateId 
    ? PREDEFINED_TEMPLATES.find(t => t.id === selectedTemplateId)
    : undefined;

  // Initialize variables when a template is selected or changes
  useEffect(() => {
    if (selectedTemplate) {
      const defaults = templateEngine.getDefaultVariables(selectedTemplate);
      const filteredDefaults = Object.fromEntries(
        Object.entries(defaults).filter(([, value]) => value !== undefined)
      ) as Record<string, string | number | boolean>;
      
      // Only initialize if not already set, or if template changed
      const hasVariablesForTemplate = selectedTemplate.variables.every(v => 
        templateVariables[v.name] !== undefined
      );
      
      if (!hasVariablesForTemplate || Object.keys(templateVariables).length === 0) {
        setTemplateVariables(filteredDefaults);
        setShowVariables(selectedTemplate.variables.length > 0);
        onTemplateSelect(selectedTemplate.id, filteredDefaults);
      }
    } else {
      // No template selected
      setTemplateVariables({});
      setShowVariables(false);
    }
  }, [selectedTemplateId]); // eslint-disable-line react-hooks/exhaustive-deps

  const categories = getTemplateCategories();
  const filteredTemplates = selectedCategory === "all" 
    ? PREDEFINED_TEMPLATES
    : getTemplatesByCategory(selectedCategory);

  const searchResults = searchQuery 
    ? filteredTemplates.filter(template => 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredTemplates;

  const handleTemplateSelect = (template: PromptTemplate) => {
    const defaults = templateEngine.getDefaultVariables(template);
    // Filter out undefined values to match our type
    const filteredDefaults = Object.fromEntries(
      Object.entries(defaults).filter(([, value]) => value !== undefined)
    ) as Record<string, string | number | boolean>;
    
    setTemplateVariables(filteredDefaults);
    onTemplateSelect(template.id, filteredDefaults);
    setShowVariables(template.variables.length > 0);
  };

  const handleVariableChange = (variableName: string, value: string | number | boolean) => {
    const newVariables = { ...templateVariables, [variableName]: value };
    setTemplateVariables(newVariables);
    onTemplateSelect(selectedTemplateId, newVariables);
  };

  const handleClearTemplate = () => {
    onTemplateSelect(undefined, {});
    setTemplateVariables({});
    setShowVariables(false);
  };

  return (
    <div className={`bg-gray-800 border border-gray-600 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Prompt Templates</h3>
        {selectedTemplateId && (
          <button
            onClick={handleClearTemplate}
            className="text-sm text-gray-400 hover:text-gray-200"
          >
            Clear Template
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Category Filter */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedCategory === "all" 
                ? "bg-blue-500 text-white" 
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm capitalize ${
                selectedCategory === category 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Template List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {searchResults.map(template => (
          <div
            key={template.id}
            onClick={() => handleTemplateSelect(template)}
            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedTemplateId === template.id
                ? "border-blue-500 bg-blue-900/30"
                : "border-gray-600 hover:border-gray-500 hover:bg-gray-700"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-white">{template.name}</h4>
                <p className="text-sm text-gray-300 mt-1">{template.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                    {template.category}
                  </span>
                  {template.variables.length > 0 && (
                    <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                      {template.variables.length} variables
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Template Variables */}
      {showVariables && selectedTemplate && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          <h4 className="font-medium mb-3 text-white">Template Variables</h4>
          <div className="space-y-3">
            {selectedTemplate.variables.map(variable => (
              <div key={variable.name}>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {variable.name}
                  {variable.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                <p className="text-xs text-gray-400 mb-2">{variable.description}</p>
                
                {variable.type === "boolean" ? (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={Boolean(templateVariables[variable.name])}
                      onChange={(e) => handleVariableChange(variable.name, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-300">Enable</span>
                  </label>
                ) : variable.options ? (
                  <select
                    value={String(templateVariables[variable.name] || variable.defaultValue || "")}
                    onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {variable.options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={variable.type === "number" ? "number" : "text"}
                    value={String(templateVariables[variable.name] || variable.defaultValue || "")}
                    onChange={(e) => {
                      const value = variable.type === "number" 
                        ? Number(e.target.value) 
                        : e.target.value;
                      handleVariableChange(variable.name, value);
                    }}
                    placeholder={variable.defaultValue?.toString() || ""}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
