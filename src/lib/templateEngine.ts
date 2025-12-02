import {
  PromptTemplate,
  TemplateVariables,
  TemplateResult,
  TemplateEngine,
  TemplateVariable,
} from "@/types/templates";

/**
 * Template engine for rendering prompt templates with variable substitution
 */
export class PromptTemplateEngine implements TemplateEngine {
  private readonly placeholderRegex = /\{\{([^}]+)\}\}/g;

  /**
   * Render a template with provided variables
   */
  render(
    template: PromptTemplate,
    variables: TemplateVariables
  ): TemplateResult {
    this.validate(template, variables);

    let content = template.content;
    const processedVariables: TemplateVariables = {};

    // Replace placeholders with variable values
    content = content.replace(this.placeholderRegex, (match, variableName) => {
      const trimmedName = variableName.trim();
      const value = variables[trimmedName];

      if (value === undefined) {
        throw new Error(`Missing required variable: ${trimmedName}`);
      }

      processedVariables[trimmedName] = value;
      return String(value);
    });

    return {
      content,
      variables: processedVariables,
      templateId: template.id,
    };
  }

  /**
   * Validate that all required variables are provided
   */
  validate(template: PromptTemplate, variables: TemplateVariables): boolean {
    const missingVariables = this.getMissingVariables(template, variables);

    if (missingVariables.length > 0) {
      throw new Error(
        `Missing required variables: ${missingVariables.join(", ")}`
      );
    }

    // Validate variable types
    for (const variable of template.variables) {
      const value = variables[variable.name];

      if (value !== undefined) {
        if (!this.validateVariableType(variable, value)) {
          throw new Error(
            `Invalid type for variable ${variable.name}. Expected ${variable.type}`
          );
        }
      }
    }

    return true;
  }

  /**
   * Get list of missing required variables
   */
  getMissingVariables(
    template: PromptTemplate,
    variables: TemplateVariables
  ): string[] {
    return template.variables
      .filter(
        (variable) =>
          variable.required && variables[variable.name] === undefined
      )
      .map((variable) => variable.name);
  }

  /**
   * Extract all variable names from template content
   */
  extractVariables(template: PromptTemplate): string[] {
    const variables: string[] = [];
    let match;

    while ((match = this.placeholderRegex.exec(template.content)) !== null) {
      const variableName = match[1].trim();
      if (!variables.includes(variableName)) {
        variables.push(variableName);
      }
    }

    return variables;
  }

  /**
   * Validate variable type
   */
  private validateVariableType(
    variable: TemplateVariable,
    value: unknown
  ): boolean {
    switch (variable.type) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number" && !isNaN(value);
      case "boolean":
        return typeof value === "boolean";
      case "array":
        return Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * Get default variables for a template
   */
  getDefaultVariables(template: PromptTemplate): TemplateVariables {
    const defaults: TemplateVariables = {};

    for (const variable of template.variables) {
      if (variable.defaultValue !== undefined) {
        defaults[variable.name] = variable.defaultValue;
      }
    }

    return defaults;
  }

  /**
   * Merge user variables with defaults
   */
  mergeWithDefaults(
    template: PromptTemplate,
    userVariables: TemplateVariables
  ): TemplateVariables {
    const defaults = this.getDefaultVariables(template);
    return { ...defaults, ...userVariables };
  }
}

// Export singleton instance
export const templateEngine = new PromptTemplateEngine();
